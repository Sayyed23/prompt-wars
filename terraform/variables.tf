variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "prompt-wars-493611"
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-east1"
}

variable "db_password" {
  description = "The password for the PostgreSQL database"
  type        = string
  sensitive   = true
}
