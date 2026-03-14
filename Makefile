PROJECT_ID=trustflow-project
IMAGE_NAME=gcr.io/$(PROJECT_ID)/trustflow-project
REGION=us-central1
SERVICE_NAME=trustflow-web

.PHONY: build push deploy down all create-project check

# Local sanity check — run before every commit
check:
	npm test && npm run build

# プロジェクト作成（初回のみ手動実行）
create-project:
	gcloud projects create $(PROJECT_ID)

build:
	docker buildx build --platform linux/amd64 --load -t $(IMAGE_NAME) .

push:
	docker push $(IMAGE_NAME)

deploy:
	gcloud config set project $(PROJECT_ID)
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME) \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated

down:
	gcloud config set project $(PROJECT_ID)
	gcloud run services delete $(SERVICE_NAME) \
		--region $(REGION) \
		--platform managed

all: build push deploy
