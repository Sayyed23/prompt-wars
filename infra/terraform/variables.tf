variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "prompt-wars-493611"
}

variable "region" {
  description = "The GCP region to deploy resources to"
  default     = "asia-south1" # Optimized for low latency in the South Asia region
}

variable "db_password" {
  description = "The password for the PostgreSQL database"
  type        = string
  sensitive   = true
}
