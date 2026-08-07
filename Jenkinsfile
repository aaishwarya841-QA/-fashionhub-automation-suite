pipeline {
    agent any

    parameters {
        choice(name: 'TEST_ENV', choices: ['local', 'staging', 'production'], description: 'Environment to run against')
    }

    environment {
        // Playwright's own image already contains Node + browsers + OS deps,
        // so the pipeline doesn't need to install anything on the agent itself.
        DOCKER_IMAGE = 'fashionhub-tests:ci'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build test image') {
            steps {
                sh 'docker build -t ${DOCKER_IMAGE} .'
            }
        }

        stage('Start demo app (local env only)') {
            when { expression { params.TEST_ENV == 'local' } }
            steps {
                sh '''
                    docker rm -f fashionhub-app || true
                    docker run -d --name fashionhub-app -p 4000:4000 pocketaces2/fashionhub-demo-app:latest
                    for i in $(seq 1 15); do
                        curl -sf http://localhost:4000/fashionhub/ && break
                        echo "Waiting for app to become ready..."; sleep 2
                    done
                '''
            }
        }

        stage('Run tests') {
            steps {
                sh '''
                    docker run --rm \
                        --network host \
                        -e TEST_ENV=${TEST_ENV} \
                        -v ${WORKSPACE}/playwright-report:/app/playwright-report \
                        -v ${WORKSPACE}/test-results:/app/test-results \
                        -v ${WORKSPACE}/reports:/app/reports \
                        ${DOCKER_IMAGE}
                '''
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
            archiveArtifacts artifacts: 'playwright-report/**, reports/**', allowEmptyArchive: true
            sh 'docker rm -f fashionhub-app || true'
        }
    }
}
