pipeline {
  agent any

  environment {
    DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
    IMAGE_NAME = 'musthafa110/nasa-app'
    KUBECONFIG = '/var/lib/jenkins/.kube/config' // ✅ Fix added here
  }

  stages {
    stage('Checkout') {
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

    stage('Push to DockerHub') {
      steps {
        withCredentials([
          usernamePassword(
            credentialsId: "${DOCKER_CREDENTIALS_ID}",
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
          )
        ]) {
          script {
            docker.withRegistry('', "${DOCKER_CREDENTIALS_ID}") {
              docker.image("${IMAGE_NAME}:latest").push()
            }
          }
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh 'kubectl apply -f k8s/deployment.yaml'
        sh 'kubectl apply -f k8s/service.yaml'
        sh 'kubectl rollout status deployment/nasa-app'
      }
    }
  }
}
