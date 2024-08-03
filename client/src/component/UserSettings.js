import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { Form, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEnvelope, FaSms, FaMobileAlt } from 'react-icons/fa';
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

const StyledCheckbox = styled(Form.Check)`
  margin-bottom: 10px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(5px);
  }
`;

const StyledButton = styled(Button)`
  background-color: #3498db;
  border: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: #2980b9;
    transform: scale(1.05);
  }
`;

function UserSettings() {
  const [preferences, setPreferences] = useState([]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users');
      setPreferences(response.data.notificationPreferences);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast.error('Failed to fetch user settings');
    }
  };

  const updatePreferences = async () => {
    try {
      await axios.post('http://localhost:5000/users/updatePreferences', { notificationPreferences: preferences });
      toast.success('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  const handlePreferenceChange = (e) => {
    const updatedPreferences = e.target.checked
      ? [...preferences, e.target.value]
      : preferences.filter(p => p !== e.target.value);
    setPreferences(updatedPreferences);
  };

  return (
    <StyledCard>
      <StyledTitle>Notification Preferences</StyledTitle>
      <Form>
        <StyledCheckbox
          type="checkbox"
          id="email-pref"
          label={<><FaEnvelope /> Email</>}
          value="email"
          checked={preferences.includes('email')}
          onChange={handlePreferenceChange}
        />
        <StyledCheckbox
          type="checkbox"
          id="sms-pref"
          label={<><FaSms /> SMS</>}
          value="sms"
          checked={preferences.includes('sms')}
          onChange={handlePreferenceChange}
        />
        <StyledCheckbox
          type="checkbox"
          id="in-app-pref"
          label={<><FaMobileAlt /> In-app</>}
          value="in-app"
          checked={preferences.includes('in-app')}
          onChange={handlePreferenceChange}
        />
        <StyledButton onClick={updatePreferences}>Save Preferences</StyledButton>
      </Form>
      <ToastContainer position="bottom-right" />
    </StyledCard>
  );
}

export default UserSettings;