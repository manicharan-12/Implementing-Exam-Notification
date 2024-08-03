import React, { useState } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCalendar, FaMapMarkerAlt, FaBook, FaBullhorn } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const AdminPageWrapper = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  animation: ${fadeIn} 0.5s ease-out;
`;

const PageTitle = styled.h1`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: bold;
  animation: ${slideIn} 0.5s ease-out;
`;

const StyledForm = styled(Form)`
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  }
`;

const StyledInput = styled(Form.Control)`
  margin-bottom: 1rem;
`;

const StyledButton = styled(Button)`
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #3498db;
`;

const Icon = styled.span`
  margin-right: 0.5rem;
`;

function AdminPage() {
  const [examData, setExamData] = useState({
    name: '',
    date: '',
    venue: '',
    preparationMaterials: '',
    announcements: '',
  });

  const handleChange = (e) => {
    setExamData({ ...examData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/exams', examData);
      console.log(response.data);
      toast.success('Exam created successfully!');
      setExamData({
        name: '',
        date: '',
        venue: '',
        preparationMaterials: '',
        announcements: '',
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      toast.error('Failed to create exam. Please try again.');
    }
  };

  return (
    <AdminPageWrapper>
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            <PageTitle>Create New Exam</PageTitle>
            <StyledForm onSubmit={handleSubmit}>
              <Form.Group>
                <IconWrapper>
                  <Icon><FaBook /></Icon>
                  <Form.Label>Exam Name</Form.Label>
                </IconWrapper>
                <StyledInput
                  type="text"
                  name="name"
                  value={examData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group>
                <IconWrapper>
                  <Icon><FaCalendar /></Icon>
                  <Form.Label>Exam Date</Form.Label>
                </IconWrapper>
                <StyledInput
                  type="datetime-local"
                  name="date"
                  value={examData.date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group>
                <IconWrapper>
                  <Icon><FaMapMarkerAlt /></Icon>
                  <Form.Label>Venue</Form.Label>
                </IconWrapper>
                <StyledInput
                  type="text"
                  name="venue"
                  value={examData.venue}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group>
                <IconWrapper>
                  <Icon><FaBook /></Icon>
                  <Form.Label>Preparation Materials</Form.Label>
                </IconWrapper>
                <StyledInput
                  as="textarea"
                  rows={3}
                  name="preparationMaterials"
                  value={examData.preparationMaterials}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group>
                <IconWrapper>
                  <Icon><FaBullhorn /></Icon>
                  <Form.Label>Announcements</Form.Label>
                </IconWrapper>
                <StyledInput
                  as="textarea"
                  rows={3}
                  name="announcements"
                  value={examData.announcements}
                  onChange={handleChange}
                />
              </Form.Group>

              <StyledButton variant="primary" type="submit">
                Create Exam
              </StyledButton>
            </StyledForm>
          </Col>
        </Row>
      </Container>
      <ToastContainer position="bottom-right" />
    </AdminPageWrapper>
  );
}

export default AdminPage;