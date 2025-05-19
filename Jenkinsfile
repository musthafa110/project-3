pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        IMAGE_NAME = 'musthafa110/nasa-app'
        KUBECONFIG = '/var/lib/jenkins/.kube/config'
        NAMESPACE = 'default'
    }

    stages {
        stage('Checkout & Build Image') {
            steps {
                git branch: 'main', url: 'https://github.com/musthafa110/project-3.git'
                script {
                    docker.build("${IMAGE_NAME}:latest", './nasa-app')
                }
            }
        }

        stage('Push Image & Install Monitoring') {
            steps {
                script {
                    // Push image to DockerHub
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        docker.withRegistry('', "${DOCKER_CREDENTIALS_ID}") {
                            docker.image("${IMAGE_NAME}:latest").push()
                        }
                    }

                    // Install Prometheus & Grafana via Helm
                    sh '''
                        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
                        helm repo update
                        helm upgrade --install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace --wait
                    '''
                }
            }
        }

        stage('Deploy & Rollout') {
            steps {
                script {
                    // Apply deployment and service
                    sh "kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml --namespace ${NAMESPACE}"
                    // Wait for deployment to be ready
                    sh "kubectl rollout status deployment/nasa-app --namespace ${NAMESPACE}"
                }
            }
        }

        stage('Verify & Monitor') {
            steps {
                script {
                    // Verify pods in both default and monitoring namespaces
                    sh "kubectl get pods --namespace ${NAMESPACE}"
                    sh "kubectl get pods --namespace monitoring"
                    
                    // Port forward to access Grafana (runs in the background)
                    sh "kubectl port-forward svc/grafana 3000:80 --namespace monitoring &"
                }
            }
        }
    }

    post {
        always { echo 'Pipeline finished.' }
        success { echo 'Deployment successful.' }
        failure { echo 'Pipeline failed. Check logs and pod status.' }
    }
}
