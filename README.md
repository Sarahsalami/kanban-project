# Real-Time Collaborative Kanban Board

A web-based collaborative Kanban application developed as part of an MSc Computer Science project. This system lets authenticated users manage shared tasks while supporting real-time synchronisation, role-based access control, and optimistic concurrency control.

## Features

- User registration and authentication
- Shared Kanban board with To Do, In Progress and Done stages
- Task creation, editing and deletion according to user permissions
- Task assignment to board members
- Drag-and-drop task movement
- Owner, Manager and Member roles
- Real-time updates using Socket.IO
- Activity history
- Optimistic concurrency control for conflicting task updates
- Responsive interface

## Technologies

- React
- Node.js
- Express
- MongoDB Atlas
- Socket.IO
- JWT authentication
- Jest
- Supertest

## Requirements

The following are required to run the application locally:

- Node.js and npm
- Git
- A MongoDB Atlas database connection
- A modern web browser such as Google Chrome, Microsoft Edge or Firefox

## Installation
  
Clone the repository:

    git clone https://github.com/Sarahsalami/kanban-project.git
    cd kanban-project

Install the backend dependencies:

    cd server
    npm install

Then, in a separate terminal, install the frontend dependencies:

    cd client
    npm install

## Environment Configuration

The backend requires environment configuration for the MongoDB Atlas connection and JWT authentication.

Store the required values in the relevant `.env` file. Do not commit private credentials or authentication secrets to the repository.

## Running the Application

Start the backend:

    cd server
    npm run dev

Then open a separate terminal and start the frontend:

    cd client
    npm run dev

Once both are running, access the application using the local address displayed by the frontend development server.

## Using the Application

Users must register or log in before accessing the Kanban board.

The application supports Owner, Manager and Member roles, with permissions applied according to the assigned role.

Depending on their role, users can:

- Create and edit tasks
- Assign tasks to board members
- Move tasks between workflow stages
- Delete tasks where permitted
- View recent activity
- Receive real-time board updates

## Real-Time and Concurrent Editing

Socket.IO synchronises accepted task changes between connected users without requiring a manual page refresh.

Optimistic concurrency control prevents stale task updates from silently overwriting newer changes. When a stale update is detected, the latest task state loads so the user can review it before attempting another update.

## Automated Tests

Automated backend tests were implemented using Jest and Supertest. The test suite contains two suites and ten tests covering authentication, task operations, authorisation and concurrency-control behaviour.

Run the tests from the server directory:

    cd server
    npm test

## Stopping the Application

The frontend and backend processes can be stopped from their respective terminals using:

    Ctrl + C

## Project Documentation

Further information about the design, implementation, testing and evaluation of the system is provided in the accompanying MSc project report.
