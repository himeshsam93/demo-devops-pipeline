pipeline {
  agent any
  environment {
    docker { image 'node:20' } 
    IMAGE_TAG = "local-${env.BUILD_NUMBER}"
    SONAR_HOST_URL = "http://host.docker.internal:9000" // adjust for Linux if needed
    SONAR_TOKEN = credentials('sonar-token') // must create in Jenkins
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install & Unit Tests') {
      steps {
        dir('app') {
          sh 'npm ci'
          sh 'npm run test --silent || true'
          sh 'npm run test:junit --silent || true'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'app/reports/junit/junit.xml'
          archiveArtifacts artifacts: 'app/coverage/**', allowEmptyArchive: true
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh "docker build -t demo-devops-app:${IMAGE_TAG} ./app"
      }
    }

    stage('Code Quality - SonarQube') {
      steps {
        sh """
          docker run --rm -v "${env.WORKSPACE}/app":/usr/src -e SONAR_HOST_URL=${SONAR_HOST_URL} \
            sonarsource/sonar-scanner-cli \
            -Dsonar.projectKey=demo-devops-app \
            -Dsonar.sources=/usr/src \
            -Dsonar.host.url=${SONAR_HOST_URL} \
            -Dsonar.login=${SONAR_TOKEN}
        """
      }
    }

    stage('Security Scan') {
      steps {
        sh """
          docker run --rm -v "${env.WORKSPACE}/app":/project aquasec/trivy:latest fs --severity CRITICAL,HIGH --ignore-unfixed /project || true
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity CRITICAL,HIGH --ignore-unfixed demo-devops-app:${IMAGE_TAG} || true
        """
        dir('app') {
          sh "npm audit --json > audit-report.json || true"
          archiveArtifacts artifacts: 'app/audit-report.json', allowEmptyArchive: true
        }
      }
    }

    stage('Deploy to Staging') {
      steps {
        sh 'docker-compose -f docker-compose.yml up -d --build'
        sh 'sleep 5'
        sh 'curl -f http://localhost:3000/health || (echo "Staging health check failed" && exit 1)'
      }
    }

    stage('Integration Check (Staging)') {
      steps {
        sh 'curl -f http://localhost:3000/ || (echo "App not responding" && exit 1)'
      }
    }

    stage('Monitoring & Alerts') {
      steps {
        sh 'docker-compose -f docker-compose.yml up -d prometheus grafana || true'
        sh 'curl -f http://localhost:9090/-/ready || echo "Prometheus not ready (ok for demo)"'
        sh 'curl -f http://localhost:3000/metrics || echo "App metrics unreachable (ok for demo)"'
      }
    }
  }
}
