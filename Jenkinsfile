pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        IMAGE_NAME = 'musthafa110/nasa-app'
        KUBECONFIG = '/var/lib/jenkins/.kube/config'
        NAMESPACE = 'default'
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
                    docker.build("${IMAGE_NAME}:latest", './nasa-app')
                }
            }
        }

        stage('Push Image to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        docker.withRegistry('', "${DOCKER_CREDENTIALS_ID}") {
                            docker.image("${IMAGE_NAME}:latest").push()
                        }
                    }
                }
            }
        }

        stage('Install Prometheus and Grafana via Helm') {
            steps {
                script {
                    sh 'helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true'
                    sh 'helm repo add grafana https://grafana.github.io/helm-charts || true'
                    sh 'helm repo update'

                    sh 'helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace'
                    sh 'helm upgrade --install grafana grafana/grafana --namespace monitoring --set adminPassword="admin"'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh "kubectl apply -f k8s/deployment.yaml --namespace ${NAMESPACE}"
                    sh "kubectl apply -f k8s/service.yaml --namespace ${NAMESPACE}"
                    // Removed prometheus-deployment.yaml
                    sh 'kubectl rollout status deployment/nasa-app --namespace ${NAMESPACE}'
                }
            }
        }

        stage('Verify Deployments') {
            steps {
                script {
                    sh "kubectl get pods --namespace ${NAMESPACE}"
                    sh "kubectl get pods --namespace monitoring"
                }
            }
        }

        stage('Expose Services') {
            steps {
                script {
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
        }
    }
}
