import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './component/NavBar';
import ExamList from './component/ExamList';
import UserSettings from './component/UserSettings';
import NotificationCenter from './component/NotificationCenter';
import AdminPage from './component/AdminPage';
import styled from 'styled-components';

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const ContentWrapper = styled.main`
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

function App() {
  return (
    <Router>
      <AppWrapper>
        <Navbar />
        <ContentWrapper>
          <Routes>
            <Route path="/" element={<ExamList />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/admin" element={<AdminPage/>} />
          </Routes>
        </ContentWrapper>
      </AppWrapper>
    </Router>
  );
}

export default App;