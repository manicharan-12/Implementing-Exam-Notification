import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Container, Form, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const StyledForm = styled(Form)`
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StyledButton = styled(Button)`
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

function AdminPage() {
  const [examData, setExamData] = useState({
    name: '',
    date: '',
    venue: '',
    announcement: '',
  });

  const handleChange = (e) => {
    setExamData({ ...examData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://implementing-exam-notification.onrender.com/exams', examData);
      console.log(response.data);
      toast.success('Exam created successfully!');
      setExamData({ name: '', date: '', venue: '', announcement: '' });
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam. Please try again.');
    }
  };

  return (
    <Container>
      <h2>Create New Exam</h2>
      <StyledForm onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Exam Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={examData.name}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Exam Date</Form.Label>
          <Form.Control
            type="datetime-local"
            name="date"
            value={examData.date}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Venue</Form.Label>
          <Form.Control
            type="text"
            name="venue"
            value={examData.venue}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Announcement</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="announcement"
            value={examData.announcement}
            onChange={handleChange}
          />
        </Form.Group>
        <StyledButton variant="primary" type="submit">
          Create Exam
        </StyledButton>
      </StyledForm>
      <ToastContainer position="bottom-right" />
    </Container>
  );
}

export default AdminPage;