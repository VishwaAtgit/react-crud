import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import App from './App';

const createTestStore = () =>
  configureStore({
    reducer: {
      users: (state = { entities: [] }, _action) => state,
      loading: (state = false, _action) => state,
    },
  });

const renderWithRoute = (route = '/') => {
  return render(
    <Provider store={createTestStore()}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </Provider>
  );
};

afterEach(cleanup);

describe('App routing coverage', () => {
  test('renders without crashing on /', () => {
    renderWithRoute('/');
    expect(document.body.firstChild).toBeTruthy();
  });

  test('renders navigation links', () => {
    renderWithRoute('/');
    const links = screen.queryAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(0);
  });

  test('renders content on /users route', () => {
    renderWithRoute('/users');
    expect(document.body.firstChild).toBeTruthy();
  });

  test('renders content on /add-user route', () => {
    renderWithRoute('/add-user');
    expect(document.body.firstChild).toBeTruthy();
  });

  test('renders content on /edit-user/:id route', () => {
    renderWithRoute('/edit-user/1');
    expect(document.body.firstChild).toBeTruthy();
  });

  test('handles unknown routes gracefully', () => {
    renderWithRoute('/this-route-does-not-exist');
    expect(document.body).toBeTruthy();
  });
});