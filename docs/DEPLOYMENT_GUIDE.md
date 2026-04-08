# VIT Internship Approval System Deployment Guide

This project is split into:

- `frontend/`: React + Vite app intended for Vercel
- `backend/`: Spring Boot app intended for Render or Railway
- `database/`: PostgreSQL schema and realistic seed data

## 1. Local Containerized Testing

Use Docker Compose for the backend plus database, then run the frontend separately with Vite.

### Start the local stack

From the repository root:

```bash
docker compose up --build
```

What this does:

- Starts PostgreSQL 15 on `localhost:5432`
- Loads `database/schema_and_mock_data.sql` on first database initialization
- Builds the Spring Boot backend from `backend/Dockerfile`
- Starts the backend on `http://localhost:8080`

### Run the frontend locally

In a separate terminal:

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

Then open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api/applications`

### Stop the stack

```bash
docker compose down
```

To remove the persisted Postgres volume as well:

```bash
docker compose down -v
```

## 2. Database Deployment with Vercel Postgres

### Provision the database

1. Open your Vercel dashboard.
2. Create or select the Vercel project that will host the frontend.
3. Go to `Storage`.
4. Create a new `Postgres` database.
5. Wait for provisioning to complete.

### Get the connection details

Vercel Postgres gives you connection environment variables such as:

- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

For the Spring Boot backend, set these environment variables on Render or Railway:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

Recommended mapping:

- `SPRING_DATASOURCE_USERNAME` = Vercel Postgres username
- `SPRING_DATASOURCE_PASSWORD` = Vercel Postgres password
- `SPRING_DATASOURCE_URL` = JDBC URL built from the Vercel Postgres host, port, and database

Example JDBC format:

```text
jdbc:postgresql://<host>:5432/<database>?sslmode=require
```

If Vercel gives you a direct non-pooling Postgres URL, prefer that data when constructing the JDBC connection string.

### Load the schema and seed data

After the cloud database is created, run the SQL file once against the provisioned Postgres instance:

```bash
psql "<your-postgres-connection-string>" -f database/schema_and_mock_data.sql
```

Use the connection string or host, user, password, and database values from Vercel Postgres.

## 3. Backend Deployment on Render

### Create the service

1. Push this repository to GitHub.
2. In Render, create a new `Web Service`.
3. Connect the GitHub repository.
4. Set the `Root Directory` to:

```text
backend
```

5. Set the environment to Java 17.

### Build and start commands

Set these exact values:

- Build Command:

```text
./mvnw clean package -DskipTests
```

- Start Command:

```text
java -jar target/*.jar
```

### Environment variables

Add these in Render:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `ALLOWED_ORIGINS=*`

Use the Vercel Postgres values from Section 2.

### Verify

After deployment, confirm the service is live by opening:

```text
https://<your-render-service>.onrender.com/api/applications
```

You should receive JSON data if the database is connected correctly.

## 4. Backend Deployment on Railway

### Create the service

1. Push this repository to GitHub.
2. In Railway, create a new project from GitHub repo.
3. Choose the repository.
4. Configure the service to use the `backend` directory as the root directory.

### Build and start commands

Set these exact values:

- Build Command:

```text
./mvnw clean package -DskipTests
```

- Start Command:

```text
java -jar target/*.jar
```

### Environment variables

Add:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `ALLOWED_ORIGINS=*`

Use the Vercel Postgres values from Section 2.

### Verify

After deployment, open:

```text
https://<your-railway-service>.up.railway.app/api/applications
```

If the service starts and returns JSON, the backend is connected properly.

## 5. Frontend Deployment on Vercel

### Create the frontend deployment

1. In Vercel, create a new project from the same GitHub repository.
2. Set the `Root Directory` to:

```text
frontend
```

3. Set the `Framework Preset` to `Vite`.
4. Vercel should automatically detect:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`

The project already includes `frontend/vercel.json` for SPA route rewrites.

### Environment variable

Add this environment variable in Vercel:

- `VITE_API_URL`

Set it to the live backend base URL, for example:

```text
https://your-render-service.onrender.com
```

or:

```text
https://your-railway-service.up.railway.app
```

Do not add `/api` manually if you want to use the provided frontend client as-is only when your value already ends with `/api`; the frontend client will normalize a plain backend base URL and append `/api` for you.

### Redeploy

After setting `VITE_API_URL`, trigger a redeploy in Vercel so the frontend build picks up the environment variable.

## 6. Final Smoke Test

After both deployments are live:

1. Open the Vercel frontend URL.
2. Submit a new internship request from the form.
3. Open the dashboard route.
4. Confirm applications load from the deployed backend.
5. Approve or reject an application from the role dashboard.

If all of that works, the split deployment is correctly configured.
