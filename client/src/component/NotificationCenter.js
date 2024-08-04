import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { ListGroup, Tab, Tabs, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaBell, FaCalendarAlt, FaBookOpen, FaBullhorn } from 'react-icons/fa';
import { ThreeDots } from 'react-loader-spinner';
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [registeredExams, setRegisteredExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchRegisteredExams();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/users/notifications');
      setNotifications(response.data.filter(notification => 
        notification.type === 'announcement' || notification.message.includes('registered') || notification.message.includes('New exam')
      ));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredExams = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/users/registeredExams');
      setRegisteredExams(response.data);
    } catch (error) {
      console.error('Error fetching registered exams:', error);
      toast.error('Failed to fetch registered exams');
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (examId) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/exams/addToCalendar', { examId });
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        toast.success('Exam added to your calendar');
        setRegisteredExams(prevExams => 
          prevExams.map(exam => 
            exam._id === examId ? { ...exam, addedToCalendar: true } : exam
          )
        );
      }
    } catch (error) {
      console.error('Error adding exam to calendar:', error);
      toast.error('Failed to add exam to calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledCard>
      {loading && (
        <LoadingOverlay>
          <ThreeDots color="#00BFFF" height={80} width={80} />
        </LoadingOverlay>
      )}
      <StyledTitle>Notification Center</StyledTitle>
      <Tabs defaultActiveKey="notifications" id="notification-tabs">
        <Tab eventKey="notifications" title="Notifications">
          <ListGroup>
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <StyledListItem key={notification._id}>
                  <Icon>
                    {notification.type === 'announcement' ? <FaBullhorn /> : 
                     notification.type === 'reminder' ? <FaBell /> : 
                     notification.type === 'material' ? <FaBookOpen /> : <FaCalendarAlt />}
                  </Icon>
                  <strong>{notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}:</strong> {notification.message}
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
                  Time: {new Date(exam.date).toLocaleTimeString()}
                  <br />
                  Venue: {exam.venue}
                  <br />
                  {exam.addedToCalendar ? (
                    <Button variant="success" size="sm" disabled>
                      Added to Calendar
                    </Button>
                  ) : (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => addToCalendar(exam._id)}
                      disabled={loading}
                    >
                      {loading ? <ThreeDots color="#00BFFF" height={20} width={40} /> : 'Add to Calendar'}
                    </Button>
                  )}
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