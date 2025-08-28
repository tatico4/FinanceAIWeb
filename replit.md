# FinanceAI - Financial Analysis Application

## Overview

FinanceAI is a comprehensive financial analysis web application that allows users to upload bank statements (PDF, Excel, CSV) and receive AI-powered financial insights and recommendations. The application automatically categorizes transactions, generates interactive visualizations, and provides personalized financial advice to help users optimize their spending and savings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using functional components and hooks
- **Styling**: Tailwind CSS with shadcn/ui component library for modern, responsive design
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling for accessibility and consistency
- **Charts**: Recharts library for interactive data visualizations (pie charts, line charts)
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **File Processing**: Multer for handling file uploads with support for PDF, Excel, and CSV formats
- **Document Parsing**: 
  - pdf-parse for PDF bank statements
  - xlsx for Excel spreadsheets
  - papaparse for CSV files
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **File Storage**: Local filesystem storage with automatic cleanup

### Data Processing Pipeline
- **Transaction Extraction**: Format-specific parsers for different file types
- **Categorization Engine**: Rule-based transaction categorization using keyword matching
- **Analysis Service**: Financial metrics calculation including income, expenses, savings rate
- **Recommendation Engine**: Personalized financial advice based on spending patterns

### Data Storage
- **Development**: In-memory storage using Map data structures
- **Production Ready**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Users table and analysis_results table with JSONB fields for flexible data storage
- **Migrations**: Drizzle Kit for database schema management

### Security & File Handling
- **File Validation**: Type checking and size limits (10MB max)
- **Temporary Storage**: Files automatically cleaned up after processing
- **CORS**: Configured for cross-origin requests
- **Input Validation**: Zod schemas for request/response validation

### Development Environment
- **Hot Reload**: Vite dev server with HMR for fast development
- **TypeScript**: Full type safety across frontend and backend
- **Path Aliases**: Configured imports for cleaner code organization
- **Environment Variables**: dotenv for configuration management

## External Dependencies

### Core Libraries
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod resolvers
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Charts**: Recharts for data visualization
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side navigation

### Backend Services
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **File Processing**: 
  - Multer for file uploads
  - pdf-parse for PDF processing
  - xlsx for Excel files
  - papaparse for CSV parsing
- **Session Management**: connect-pg-simple for PostgreSQL session store

### Development Tools
- **Build System**: Vite with TypeScript support
- **Code Quality**: ESBuild for production bundling
- **Development**: tsx for TypeScript execution
- **Replit Integration**: Cartographer and runtime error modal plugins

### Utility Libraries
- **Date Handling**: date-fns for date manipulation
- **Class Management**: clsx and tailwind-merge for conditional styling
- **Icons**: Lucide React for consistent iconography
- **Carousel**: Embla Carousel for interactive components
- **Command Interface**: cmdk for command palette functionality

### Future Integrations
- **AI/ML Services**: OpenAI API for advanced transaction categorization
- **NLP**: Natural language processing for transaction description analysis
- **Authentication**: Planned user authentication system
- **Cloud Storage**: Potential migration to cloud-based file storage