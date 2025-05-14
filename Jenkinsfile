pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        IMAGE_NAME = 'musthafa110/nasa-app'
        KUBECONFIG = '/var/lib/jenkins/.kube/config' // Adjust to your specific Kubeconfig path
        NAMESPACE = 'default' // Namespace for your app deployment
        MONITORING_NAMESPACE = 'monitoring' // Namespace for Prometheus and Grafana
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
                    // Add the Prometheus and Grafana Helm repositories
                    sh 'helm repo add prometheus-community https://prometheus-community.github.io/helm-charts'
                    sh 'helm repo add grafana https://grafana.github.io/helm-charts'
                    sh 'helm repo update'

                    // Install Prometheus using Helm (in monitoring namespace)
                    sh 'helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace ${MONITORING_NAMESPACE} --create-namespace'

                    // Install Grafana using Helm (in monitoring namespace)
                    sh 'helm upgrade --install grafana grafana/grafana --namespace ${MONITORING_NAMESPACE} --set adminPassword="admin"'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Apply Kubernetes deployment and service files
                    sh "kubectl apply -f k8s/deployment.yaml --namespace ${NAMESPACE}"
                    sh "kubectl apply -f k8s/service.yaml --namespace ${NAMESPACE}"
                    sh "kubectl apply -f k8s/prometheus-deployment.yaml --namespace ${MONITORING_NAMESPACE}"

                    // Wait for the application deployment to complete
                    sh 'kubectl rollout status deployment/nasa-app --namespace ${NAMESPACE}'

                    // Wait for the correct Prometheus deployment to complete
                    sh 'kubectl rollout status deployment/prometheus-kube-prometheus-prometheus --namespace ${MONITORING_NAMESPACE}'
                }
            }
        }

        stage('Verify Deployments') {
            steps {
                script {
                    // Verify deployment status of your app and Prometheus in their respective namespaces
                    sh 'kubectl get pods --namespace ${NAMESPACE}'
                    sh 'kubectl get pods --namespace ${MONITORING_NAMESPACE}'
                }
            }
        }

        stage('Expose Services') {
            steps {
                script {
                    // Expose Prometheus and Grafana via port forwarding (if needed)
                    sh 'kubectl port-forward svc/prometheus 9090:9090 --namespace ${MONITORING_NAMESPACE} &'
                    sh 'kubectl port-forward svc/grafana 3000:80 --namespace ${MONITORING_NAMESPACE} &'
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
