import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { Container, Row, Col, Button, Card, ListGroup, Nav, Spinner } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCalendarAlt, FaBookOpen, FaBullhorn, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
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

const StyledContainer = styled(Container)`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StyledNav = styled(Nav)`
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
`;

const StyledNavLink = styled(Nav.Link)`
  color: ${props => props.active ? '#6200ea' : '#757575'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border-bottom: ${props => props.active ? '2px solid #6200ea' : 'none'};
  transition: all 0.3s ease;

  &:hover {
    color: #6200ea;
  }
`;

const StyledTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
  animation: ${slideIn} 0.5s ease-out;
`;

const StyledButton = styled(Button)`
  background-color: ${props => props.variant === 'outline-primary' ? 'transparent' : '#6200ea'};
  border-color: #6200ea;
  color: ${props => props.variant === 'outline-primary' ? '#6200ea' : 'white'};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.variant === 'outline-primary' ? '#6200ea' : '#3700b3'};
    color: white;
    transform: scale(1.05);
  }
`;

const StyledListItem = styled(ListGroup.Item)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }

  &:hover {
    background-color: #f8f9fa;
  }
`;

const IconWrapper = styled.span`
  margin-right: 10px;
`;

const DetailsWrapper = styled.div`
  max-height: ${props => props.show ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.5s ease-in-out;
  width: 100%;
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

function ExamList() {
  const [availableExams, setAvailableExams] = useState([]);
  const [registeredExams, setRegisteredExams] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const examsResponse = await axios.get('http://localhost:5000/exams');
      const registeredExamsResponse = await axios.get('http://localhost:5000/users/registeredExams');

      const availableExams = examsResponse.data.filter(exam => !registeredExamsResponse.data.some(regExam => regExam._id === exam._id));

      setAvailableExams(availableExams);
      setRegisteredExams(registeredExamsResponse.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to fetch exams. Please try again later.');
      toast.error('Failed to fetch exams. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const registerForExam = async (examId) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/exams/register', { examId });
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
      toast.success(response.data.message);
      await fetchExams(); // Refresh the exam lists
    } catch (error) {
      console.error('There was an error!', error);
      toast.error(error.response?.data?.message || 'Failed to register for exam.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <StyledContainer>
      {loading && (
        <LoadingOverlay>
          <ThreeDots color="#00BFFF" height={80} width={80} />
        </LoadingOverlay>
      )}
      <StyledNav variant="tabs">
        <Nav.Item>
          <StyledNavLink active={activeTab === 'available'} onClick={() => setActiveTab('available')}>
            Available Exams
          </StyledNavLink>
        </Nav.Item>
        <Nav.Item>
          <StyledNavLink active={activeTab === 'registered'} onClick={() => setActiveTab('registered')}>
            Registered Exams
          </StyledNavLink>
        </Nav.Item>
      </StyledNav>

      <StyledCard>
        <Card.Body>
          <StyledTitle>{activeTab === 'available' ? 'Available Exams' : 'Registered Exams'}</StyledTitle>
          <ListGroup>
            {(activeTab === 'available' ? availableExams : registeredExams).map(exam => (
              <StyledListItem key={exam._id}>
                <div>
                  <IconWrapper><FaCalendarAlt /></IconWrapper>
                  {exam.name}
                  <br />
                  <IconWrapper><FaClock /></IconWrapper>
                  {new Date(exam.date).toLocaleString()}
                  <br />
                  <IconWrapper><FaMapMarkerAlt /></IconWrapper>
                  {exam.venue}
                </div>
                {activeTab === 'available' ? (
                  <StyledButton 
                    onClick={() => registerForExam(exam._id)}
                    disabled={loading}
                  >
                    {loading ? <ThreeDots color="#ffffff" height={20} width={40} /> : 'Register'}
                  </StyledButton>
                ) : (
                  <ExamDetails exam={exam} />
                )}
              </StyledListItem>
            ))}
          </ListGroup>
        </Card.Body>
      </StyledCard>
      <ToastContainer position="bottom-right" />
    </StyledContainer>
  );
}

function ExamDetails({ exam }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      <StyledButton 
        variant="outline-primary" 
        onClick={() => setShowDetails(!showDetails)}
        style={{ marginTop: '10px' }}
      >
        {showDetails ? <FaChevronUp /> : <FaChevronDown />} {showDetails ? 'Hide Details' : 'Show Details'}
      </StyledButton>
      <DetailsWrapper show={showDetails}>
        <Card.Body>
          <h4><IconWrapper><FaBookOpen /></IconWrapper>Preparation Materials:</h4>
          <ListGroup>
            {exam.preparationMaterials.map((material, index) => (
              <ListGroup.Item key={index}>{material}</ListGroup.Item>
            ))}
          </ListGroup>
          <h4><IconWrapper><FaBullhorn /></IconWrapper>Announcements:</h4>
          <ListGroup>
            {exam.announcements.map((announcement, index) => (
              <ListGroup.Item key={index}>{announcement}</ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </DetailsWrapper>
    </div>
  );
}

export default ExamList;