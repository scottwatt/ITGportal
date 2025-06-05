// src/hooks/useClients.js
import { useState, useEffect } from 'react';
import { 
  addNewClient as addClient,
  updateClientProgress as updateProgress,
  removeClient as deleteClient,
  resetClientPassword as resetPassword,
  createClientLoginAccount as createLogin,
  subscribeToClients
} from '../services/firebase/clients';

export const useClients = (isAuthenticated) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up real-time subscription to clients
  useEffect(() => {
    if (!isAuthenticated) {
      setClients([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToClients((clientsData) => {
      setClients(clientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addNewClient = async (clientData) => {
    try {
      setError(null);
      const result = await addClient(clientData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateClientProgress = async (clientId, updates) => {
    try {
      setError(null);
      await updateProgress(clientId, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const resetClientPassword = async (client) => {
  try {
    setError(null);
    const result = await resetPassword(client);
    return result;
  } catch (error) {
    setError(error.message);
    throw error;
  }
};

  const removeClient = async (clientId, schedules) => {
    try {
      setError(null);
      await deleteClient(clientId, schedules);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const createClientLoginAccount = async (client) => {
    try {
      setError(null);
      const result = await createLogin(client);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getClientById = (id) => {
    return clients.find(client => client.id === id);
  };

  const getClientsByProgram = (program) => {
    if (program === 'all') return clients;
    return clients.filter(client => (client.program || 'limitless') === program);
  };

  const getSchedulableClients = () => {
    return clients.filter(client => {
      const program = client.program || 'limitless';
      return ['limitless', 'new-options', 'bridges'].includes(program);
    });
  };

  return {
    clients,
    loading,
    error,
    addNewClient,
    updateClientProgress,
    removeClient,
    resetClientPassword,
    createClientLoginAccount,
    getClientById,
    getClientsByProgram,
    getSchedulableClients
  };
};