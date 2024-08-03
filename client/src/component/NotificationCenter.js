import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { ListGroup, Tab, Tabs } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaBell, FaCalendarAlt } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const StyledCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const StyledTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
  animation: ${slideIn} 0.5s ease-out;
`;

const StyledListItem = styled(ListGroup.Item)`
  transition: all 0.3s ease;
  border-left: 4px solid #3498db;

  &:hover {
    background-color: #f8f9fa;
    transform: translateX(5px);
  }
`;

const Icon = styled.span`
  margin-right: 10px;
`;

const NoNotificationsMessage = styled.p`
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
`;

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [registeredExams, setRegisteredExams] = useState([]);

  useEffect(() => {
    fetchNotifications();
    fetchRegisteredExams();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users/notifications');
      const filteredNotifications = response.data.filter(notification => 
        notification.type === 'announcement' || 
        (notification.type === 'reminder' && isUpcomingExam(notification.date))
      );
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    }
  };

  const fetchRegisteredExams = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users/registeredExams');
      setRegisteredExams(response.data);
    } catch (error) {
      console.error('Error fetching registered exams:', error);
      toast.error('Failed to fetch registered exams');
    }
  };

  const isUpcomingExam = (date) => {
    const examDate = new Date(date);
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // one week in milliseconds
    return examDate > now && examDate - now <= oneWeek;
  };

  return (
    <StyledCard>
      <StyledTitle>Notification Center</StyledTitle>
      <Tabs defaultActiveKey="notifications" id="notification-tabs">
        <Tab eventKey="notifications" title="Notifications">
          <ListGroup>
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <StyledListItem key={notification._id}>
                  <Icon>
                    <FaBell />
                  </Icon>
                  <strong>{notification.type === 'announcement' ? 'New Exam Created' : 'Upcoming Exam'}:</strong> {notification.message}
                  <br />
                  <small>{new Date(notification.date).toLocaleString()}</small>
                </StyledListItem>
              ))
            ) : (
              <NoNotificationsMessage>No new notifications</NoNotificationsMessage>
            )}
          </ListGroup>
        </Tab>
        <Tab eventKey="registeredExams" title="Registered Exams">
          <ListGroup>
            {registeredExams.length > 0 ? (
              registeredExams.map(exam => (
                <StyledListItem key={exam._id}>
                  <Icon>
                    <FaCalendarAlt />
                  </Icon>
                  <strong>{exam.name}</strong>
                  <br />
                  Date: {new Date(exam.date).toLocaleDateString()}
                  <br />
                  Venue: {exam.venue}
                </StyledListItem>
              ))
            ) : (
              <NoNotificationsMessage>No registered exams</NoNotificationsMessage>
            )}
          </ListGroup>
        </Tab>
      </Tabs>
      <ToastContainer position="bottom-right" />
    </StyledCard>
  );
}

export default NotificationCenter;