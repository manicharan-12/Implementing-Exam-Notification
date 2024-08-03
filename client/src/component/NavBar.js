import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavbarWrapper = styled.nav`
  background-color: #2c3e50;
  padding: 1rem;
`;

const NavbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavbarTitle = styled.h1`
  color: white;
  margin: 0;
`;

const NavbarMenu = styled.ul`
  list-style-type: none;
  display: flex;
  margin: 0;
  padding: 0;
`;

const NavbarItem = styled.li`
  margin-left: 1rem;
`;

const NavbarLink = styled(Link)`
  color: white;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: #3498db;
  }
`;

function Navbar() {
  return (
    <NavbarWrapper>
      <NavbarContainer>
        <NavbarTitle>RMS Exam Portal</NavbarTitle>
        <NavbarMenu>
          <NavbarItem>
            <NavbarLink to="/">Exams</NavbarLink>
          </NavbarItem>
          <NavbarItem>
            <NavbarLink to="/settings">Settings</NavbarLink>
          </NavbarItem>
          <NavbarItem>
            <NavbarLink to="/notifications">Notifications</NavbarLink>
          </NavbarItem>
          <NavbarItem>
            <NavbarLink to="/admin">Admin</NavbarLink>
          </NavbarItem>
        </NavbarMenu>
      </NavbarContainer>
    </NavbarWrapper>
  );
}

export default Navbar;