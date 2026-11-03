.PHONY: backend-up backend-down frontend-up frontend-down

backend-up:
	cd backend && nohup ./gradlew bootRun > ../backend.log 2>&1 &

backend-down:
	fuser -k -TERM 8080/tcp

frontend-up:
	cd frontend && nohup npm run dev > ../frontend.log 2>&1 &

frontend-down:
	fuser -k -TERM 5173/tcp
