import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Container, Button, Card, ListGroup, Nav } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChevronDown, FaChevronUp, FaBookOpen, FaBullhorn } from 'react-icons/fa';
import { ThreeDots } from 'react-loader-spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

const StyledContainer = styled(Container)`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

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
  const [allExams, setAllExams] = useState([]);
  const [registeredExams, setRegisteredExams] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const [examsResponse, registeredExamsResponse] = await Promise.all([
        axios.get('https://implementing-exam-notification.onrender.com/exams'),
        axios.get('https://implementing-exam-notification.onrender.com/users/registeredExams')
      ]);
      setAllExams(examsResponse.data);
      setRegisteredExams(registeredExamsResponse.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to fetch exams. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const availableExams = allExams.filter(exam => 
    !registeredExams.some(regExam => regExam._id === exam._id)
  );

  console.log('All Exams:', allExams);
  console.log('Registered Exams:', registeredExams);
  console.log('Available Exams:', availableExams);

  const registerForExam = async (examId) => {
    setLoading(true);
    try {
      const response = await axios.post('https://implementing-exam-notification.onrender.com/exams/register', { examId });
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        toast.success('Successfully registered for the exam');
        await fetchExams(); // Refresh both exam lists
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to register for exam.');
    } finally {
      setLoading(false);
    }
  };

  const displayedExams = activeTab === 'available' ? availableExams : registeredExams;
  console.log('Displayed Exams:', displayedExams);

  return (
    <StyledContainer>
      {loading && (
        <LoadingOverlay>
          <ThreeDots color="#00BFFF" height={80} width={80} />
        </LoadingOverlay>
      )}
      <StyledNav variant="tabs">
        <Nav.Item>
          <StyledNavLink 
            active={activeTab === 'available'} 
            onClick={() => setActiveTab('available')}
          >
            Available Exams ({availableExams.length})
          </StyledNavLink>
        </Nav.Item>
        <Nav.Item>
          <StyledNavLink 
            active={activeTab === 'registered'} 
            onClick={() => setActiveTab('registered')}
          >
            Registered Exams ({registeredExams.length})
          </StyledNavLink>
        </Nav.Item>
      </StyledNav>
      
      <StyledCard>
        <Card.Body>
          <ListGroup>
            {displayedExams.length > 0 ? (
              displayedExams.map((exam) => (
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
              ))
            ) : (
              <StyledListItem>No {activeTab === 'available' ? 'available' : 'registered'} exams found.</StyledListItem>
            )}
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
            {exam.preparationMaterials && exam.preparationMaterials.length > 0 ? (
              exam.preparationMaterials.map((material, index) => (
                <ListGroup.Item key={index}>{material}</ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>No preparation materials available.</ListGroup.Item>
            )}
          </ListGroup>
          <h4><IconWrapper><FaBullhorn /></IconWrapper>Announcements:</h4>
          <ListGroup>
            {exam.announcements && exam.announcements.length > 0 ? (
              exam.announcements.map((announcement, index) => (
                <ListGroup.Item key={index}>{announcement}</ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>No announcements available.</ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
      </DetailsWrapper>
    </div>
  );
}

export default ExamList;
