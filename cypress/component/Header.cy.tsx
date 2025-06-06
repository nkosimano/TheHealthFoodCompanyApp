import React from 'react';
import { mount } from 'cypress/react18';
import { AuthProvider } from '../../src/context/authExports';
import { NetworkProvider } from '../../src/context/networkExports';
import { SyncProvider } from '../../src/context/syncExports';
import { AppProvider } from '../../src/context/appExports';
import Header from '../../src/components/Header';

describe('Header.cy.tsx', () => {
  it('renders', () => {
    mount(
      <NetworkProvider>
        <AuthProvider>
          <SyncProvider>
            <AppProvider>
              <Header />
            </AppProvider>
          </SyncProvider>
        </AuthProvider>
      </NetworkProvider>
    );
  });
});