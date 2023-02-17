DOCKERCOMPOSE 	= docker compose
COMPOSEFILE 	= -f docker-compose.dev.yml

BUILD 			= build
START 			= start
RESTART 		= restart
UP 				= up -d
STOP 			= stop
DOWN 			= down
REMOVEALL 		= --rmi all --volumes

all: init build

.PHONY: init
init:
	rm -f frontend/tsconfig.tsbuildinfo
	cd frontend && npm update && npx tsc && npx webpack

.PHONY: build
build:
	${DOCKERCOMPOSE} ${COMPOSEFILE} ${BUILD}

.PHONY: start
start:
	${DOCKERCOMPOSE} ${COMPOSEFILE} ${START}

.PHONY: restart
restart:
	${DOCKERCOMPOSE} ${COMPOSEFILE} ${RESTART}

.PHONY: up
up: all
	${DOCKERCOMPOSE} ${COMPOSEFILE} ${UP}

.PHONY: stop
stop:
	${DOCKERCOMPOSE} ${COMPOSEFILE} ${STOP}

.PHONY: down
down:
	${DOCKERCOMPOSE} ${COMPOSEFILE} ${DOWN}

.PHONY: clean
clean: down
	docker volume prune -f

.PHONY: fclean
fclean:
	${DOCKERCOMPOSE} ${COMPOSEFILE} ${DOWN} ${REMOVEALL}
	docker system prune -af --volumes
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/out
	rm -f frontend/tsconfig.tsbuildinfo

.PHONY: re
re: clean up