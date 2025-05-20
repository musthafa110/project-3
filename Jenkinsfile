pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        IMAGE_NAME = 'musthafa110/nasa-app'
        KUBECONFIG = '/var/lib/jenkins/.kube/config'
        NAMESPACE = 'default'
        MONITORING_NAMESPACE = 'monitoring'
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

        stage('Push Docker Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        docker.withRegistry('', "${DOCKER_CREDENTIALS_ID}") {
                            docker.image("${IMAGE_NAME}:latest").push()
                        }
                    }
                }
            }
        }

        stage('Install Monitoring Tools') {
            steps {
                script {
                    sh '''
                        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
                        helm repo update
                        helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
                            --namespace ${MONITORING_NAMESPACE} --create-namespace --wait
                    '''
                }
            }
        }

        stage('Canary Deployment') {
            steps {
                script {
                    sh '''
                        kubectl apply -f k8s/deployment-v1.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/deployment-v2.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/service.yaml -n ${NAMESPACE}

                        kubectl rollout status deployment/nasa-app-v1 -n ${NAMESPACE}
                        kubectl rollout status deployment/nasa-app-v2 -n ${NAMESPACE}
                    '''
                }
            }
        }

        stage('Verify Deployments & Services') {
            steps {
                script {
                    sh '''
                        echo "App Pods in Default Namespace:"
                        kubectl get pods -n ${NAMESPACE}

                        echo "Monitoring Pods:"
                        kubectl get pods -n ${MONITORING_NAMESPACE}

                        echo "Monitoring Services:"
                        kubectl get svc -n ${MONITORING_NAMESPACE}
                    '''
                }
            }
        }

        stage('Expose Monitoring Dashboards') {
            steps {
                script {
                    def grafanaSvc = sh(script: "kubectl get svc -n ${MONITORING_NAMESPACE} -l app.kubernetes.io/name=grafana -o jsonpath='{.items[0].metadata.name}'", returnStdout: true).trim()
                    def prometheusSvc = sh(script: "kubectl get svc -n ${MONITORING_NAMESPACE} -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].metadata.name}'", returnStdout: true).trim()

                    sh """
                        nohup kubectl port-forward svc/${grafanaSvc} 3000:80 -n ${MONITORING_NAMESPACE} > grafana.log 2>&1 &
                        nohup kubectl port-forward svc/${prometheusSvc} 9090:9090 -n ${MONITORING_NAMESPACE} > prometheus.log 2>&1 &
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully."
            echo "Grafana is available at http://localhost:3000"
            echo "Prometheus is available at http://localhost:9090"
        }
        failure {
            echo "Pipeline failed. Check logs and cluster status for troubleshooting."
        }
        always {
            sh "pkill -f 'kubectl port-forward' || true"
            echo "Cleaned up port-forward background processes."
        }
    }
}
