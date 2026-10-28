.PHONY: install lint typecheck test load-test docker-build

install:
	npm ci

lint:
	npx eslint .

typecheck:
	npx tsc --noEmit

test:
	npx vitest run --coverage

load-test:
	k6 run load-tests/k6-checkout.js

docker-build:
	docker build -t enterprise-checkout-system:latest .
