pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        IMAGE_NAME = 'musthafa110/nasa-app'
        KUBECONFIG = '/var/lib/jenkins/.kube/config' // Adjust to your specific Kubeconfig path
        NAMESPACE = 'default' // Add the appropriate namespace if needed
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/musthafa110/project-3.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Building Docker image for the application
                    docker.build("${IMAGE_NAME}:latest", './nasa-app')
                }
            }
        }

        stage('Push Image to DockerHub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${DOCKER_CREDENTIALS_ID}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    script {
                        // Log in to Docker registry
                        docker.withRegistry('', "${DOCKER_CREDENTIALS_ID}") {
                            // Push the built image to DockerHub
                            docker.image("${IMAGE_NAME}:latest").push()
                        }
                    }
                }
            }
        }

        stage('Install Prometheus and Grafana via Helm') {
            steps {
                script {
                    // Ensure Helm is installed, this might be part of your Jenkins agent setup
                    sh 'helm repo add prometheus-community https://prometheus-community.github.io/helm-charts'
                    sh 'helm repo add grafana https://grafana.github.io/helm-charts'
                    sh 'helm repo update'

                    // Install Prometheus using Helm (in monitoring namespace)
                    sh 'helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace'

                    // Install Grafana using Helm (in monitoring namespace)
                    sh 'helm upgrade --install grafana grafana/grafana --namespace monitoring --set adminPassword="admin"'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Apply Kubernetes deployment and service files
                    sh "kubectl apply -f k8s/deployment.yaml"
                    sh "kubectl apply -f k8s/service.yaml"
                    sh "kubectl apply -f k8s/prometheus-deployment.yaml"

                    // Wait for the application and Prometheus deployments to complete
                    sh 'kubectl rollout status deployment/nasa-app --namespace ${NAMESPACE}'
                    sh 'kubectl rollout status deployment/prometheus --namespace monitoring'
                }
            }
        }

        stage('Verify Deployments') {
            steps {
                script {
                    // Check pod status and logs to verify deployment
                    sh 'kubectl get pods --namespace ${NAMESPACE}'
                    sh 'kubectl get pods --namespace monitoring'
                }
            }
        }

        stage('Expose Services') {
            steps {
                script {
                    // Expose Prometheus and Grafana via port forwarding (if needed)
                    sh 'kubectl port-forward svc/prometheus 9090:9090 --namespace monitoring &'
                    sh 'kubectl port-forward svc/grafana 3000:80 --namespace monitoring &'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }

        success {
            echo 'Pipeline successfully executed.'
        }

        failure {
            echo "Pipeline failed. Please check logs and pod status."
            // Additional error handling actions can go here (like notifying or sending alerts)
        }
    }
}
