## About Repository

Frontend web application for **Flood Forecasting Warning System – Dinas PU Sumber Daya Air Jawa Timur**. This repository contains the web monitoring dashboard used to visualize water level, rainfall, and forecasting results from the backend and machine learning services.

## Tech Stack

### Frontend

- **React 18** (Create React App)
- **React Router** – routing
- **Axios** – API communication
- **Chart.js & react-chartjs-2** – data visualization
- **Leaflet & react-leaflet** – interactive maps
- **Tailwind CSS** – styling

### Backend

- **Laravel** (REST API)
- **MySQL** – relational database
- **Laravel Mix** – asset bundling
- **Axios** – frontend-backend communication

### Machine Learning

- **Python 3**
- **TensorFlow & Keras** – deep learning models (LSTM, GRU, TCN)
- **Flask** – ML inference API
- **NumPy & Pandas** – data processing
- **Scikit-learn** – evaluation & preprocessing
- **SQLAlchemy** – database ORM
- **Gunicorn** – production WSGI server

## Requirements

- **Node.js** >= 16.x (recommended)
- **npm** or **yarn**

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/SomeRandomDolphin/ffws-frontend
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

### 3. Configure environment (optional but recommended)

Create a `.env` file in the root directory and set your backend API base URL:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

> Adjust the URL based on your backend deployment.

### 4. Run the development server

```bash
npm start
```

The app will be available at:

```
http://localhost:3000
```

## Available Scripts

- **Start development server**

```bash
npm start
```

- **Build for production**

```bash
npm run build
```

Generates an optimized production build in the `build/` folder.

- **Run tests**

```bash
npm test
```

- **Eject (advanced)**

```bash
npm run eject
```

> ⚠️ This is irreversible. Use only if you need full control over the configuration.

## Project Features

- Real-time and historical water level visualization
- Rainfall and flood forecasting charts
- Interactive river and monitoring station maps
- Responsive dashboard UI

## Build & Deployment Notes

- The project uses **Create React App** with `homepage` set to `.` for relative paths.
- After running `npm run build`, deploy the contents of the `build/` directory to your web server.

## Related Repositories

- **FFWS Frontend**
  [https://github.com/SomeRandomDolphin/ffws-frontend](https://github.com/SomeRandomDolphin/ffws-frontend)

- **FFWS Backend**
  [https://github.com/SomeRandomDolphin/ffws-backend](https://github.com/SomeRandomDolphin/ffws-backend)

- **FFWS Machine Learning**
  [https://github.com/SomeRandomDolphin/ffws-ml](https://github.com/SomeRandomDolphin/ffws-ml)

The frontend consumes REST APIs from the backend service, while the backend integrates with the ML service for flood level forecasting and analytics.

## License

This project is for government and research use under the Flood Forecasting Warning System initiative.
