provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. Dedicated Service Account for Cloud Run
resource "google_service_account" "crowdflow_runner" {
  account_id   = "crowdflow-runner"
  display_name = "CrowdFlow Cloud Run Runner"
}

# 2. IAM Roles for the Runner
resource "google_project_iam_member" "sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.crowdflow_runner.email}"
}



# 3. Secret Manager Scaffolding (Values to be populated manually)
resource "google_secret_manager_secret" "db_url" {
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "redis_url" {
  secret_id = "REDIS_URL"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "GEMINI_API_KEY"
  replication {
    auto {}
  }
}

# 4. Access to Secrets
resource "google_secret_manager_secret_iam_member" "db_url_access" {
  secret_id = google_secret_manager_secret.db_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.crowdflow_runner.email}"
}

resource "google_secret_manager_secret_iam_member" "redis_url_access" {
  secret_id = google_secret_manager_secret.redis_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.crowdflow_runner.email}"
}

resource "google_secret_manager_secret_iam_member" "gemini_api_key_access" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.crowdflow_runner.email}"
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "crowdflow_repo" {
  location      = var.region
  repository_id = "crowdflow"
  description   = "Docker repository for CrowdFlow platform"
  format        = "DOCKER"
}

# VPC Network
resource "google_compute_network" "vpc_network" {
  name                    = "crowdflow-vpc"
  auto_create_subnetworks = true
}

# Serverless VPC Access Connector
resource "google_vpc_access_connector" "connector" {
  name          = "crowdflow-connector"
  region        = var.region
  network       = google_compute_network.vpc_network.name
  ip_cidr_range = "10.8.0.0/28"
}

# Memorystore Redis (5GB, Standard HA)
resource "google_redis_instance" "crowdflow_cache" {
  name           = "crowdflow-cache"
  tier           = "STANDARD_HA"
  memory_size_gb = 5
  region         = var.region
  authorized_network = google_compute_network.vpc_network.id
  connect_mode   = "DIRECT_PEERING"
  redis_version  = "REDIS_7_0"

  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours = 2
      }
    }
  }
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "crowdflow_db" {
  name             = "crowdflow-db-instance"
  region           = var.region
  database_version = "POSTGRES_15"

  settings {
    tier = "db-f1-micro" # Smallest tier for MVP, can be scaled up
    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc_network.id
    }
  }
  deletion_protection = false # Set to true for production
}

resource "google_sql_database" "database" {
  name     = "crowdflow"
  instance = google_sql_database_instance.crowdflow_db.name
}

resource "google_sql_user" "users" {
  name     = "crowdflow_user"
  instance = google_sql_database_instance.crowdflow_db.name
  password = var.db_password
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "crowdflow_service" {
  name     = "crowdflow-platform"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.crowdflow_runner.email
    scaling {
      min_instance_count = 2
      max_instance_count = 100
    }
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "ALL_TRAFFIC"
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/crowdflow/platform:latest"
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = "DATABASE_URL"
            version = "latest"
          }
        }
      }
      env {
        name = "REDIS_URL"
        value_source {
          secret_key_ref {
            secret  = "REDIS_URL"
            version = "latest"
          }
        }
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "GEMINI_API_KEY"
            version = "latest"
          }
        }
      }
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }
}

output "redis_host" {
  value = google_redis_instance.crowdflow_cache.host
}

output "db_connection_name" {
  value = google_sql_database_instance.crowdflow_db.connection_name
}

output "runner_service_account" {
  value = google_service_account.crowdflow_runner.email
}
