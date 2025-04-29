pipeline {
  agent any

  environment {
    DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
    IMAGE_NAME = 'musthafa110/nasa-app'
  }

  stages {
    stage('Checkout') {
      steps {
        git 'https://github.com/musthafa110/project3.git'
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
        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
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
      }
    }
  }
}

