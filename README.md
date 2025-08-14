# ROI Change Driver Analysis — Interactive Decision Tree Platform

A comprehensive web-based platform for analyzing ROI changes in loan portfolios through interactive decision trees.

## 🎯 Features

### Core Capabilities
- **Dual File Support**: Upload two separate CSVs or single Excel with multiple sheets
- **Target Variable Selection**: Analyze Weighted ROI, Delinquency %, NIM, etc.
- **Two Analysis Variants**:
  - **User-Priority Mode**: Drag-and-drop factor ordering for custom analysis
  - **Auto-Max Split Mode**: AI-driven feature selection for optimal ROI change explanation
- **Interactive Visualizations**: Professional decision trees with hover tooltips and export options
- **Professional Reporting**: Export diagrams and detailed breakdowns

### Technical Features
- Modern React frontend with Material-UI components
- RESTful Node.js backend with Express
- Real-time file processing and validation
- Interactive drag-and-drop interfaces
- Professional data visualization with D3.js
- Export functionality (PNG, SVG, PDF, Excel)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone and setup**:
```bash
cd /Users/ashutoshnagar/client-projects/roi-change-driver-platform
npm install
```

2. **Install frontend dependencies**:
```bash
cd frontend
npm install
```

3. **Install backend dependencies**:
```bash
cd ../backend
npm install
```

4. **Start development servers**:

Backend:
```bash
cd backend
npm run dev
```

Frontend (in new terminal):
```bash
cd frontend
npm start
```

5. **Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Usage Flow

1. **Upload Data**: Drag-and-drop CSV files or Excel with multiple sheets
2. **Select Variables**: Choose target variable(s) for analysis
3. **Choose Analysis Mode**:
   - User-Priority: Drag factors to define analysis order
   - Auto-Max Split: Let AI find optimal splits
4. **View Results**: Interactive decision trees with detailed insights
5. **Export**: Download professional reports and diagrams

## 🏗️ Architecture

```
roi-change-driver-platform/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── utils/          # Helper functions
│   │   └── hooks/          # Custom React hooks
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Business logic
│   │   ├── services/       # Core services
│   │   └── utils/          # Helper utilities
└── shared/                 # Shared types and utilities
```

## 🔧 Technology Stack

### Frontend
- **React 18** with functional components and hooks
- **Material-UI** for professional UI components
- **react-dropzone** for file upload
- **react-beautiful-dnd** for drag-and-drop
- **react-d3-tree** for decision tree visualization
- **recharts** for additional charts

### Backend
- **Node.js** with Express framework
- **multer** for file upload handling
- **xlsx** for Excel file processing
- **csv-parser** for CSV processing
- **ml-cart** for decision tree algorithms

## 📈 Business Impact

- **For Analysts**: Saves hours of manual data slicing and analysis
- **For Managers**: Clear, professional decision trees for quick insights
- **For Executives**: Visual storytelling of yield movements and key drivers

## 🛣️ Roadmap

- [ ] Integration with LLM for natural language explanations
- [ ] Scheduled automated reports
- [ ] Multi-metric simultaneous analysis
- [ ] Advanced export options
- [ ] User authentication and project management

## 📝 License

MIT License - see LICENSE file for details.

---

**Built for professional financial analysis and decision-making.**
