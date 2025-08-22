import { useState, useEffect, useCallback, useRef } from 'react';

interface FormPersistenceOptions {
  key: string;
  autoSaveInterval?: number;
  enableBeforeUnload?: boolean;
}

interface FormState {
  data: any;
  isDirty: boolean;
  lastSaved: number;
  isAutoSaving: boolean;
}

export const useFormPersistence = <T extends Record<string, any>>(
  initialData: T,
  options: FormPersistenceOptions
) => {
  const { key, autoSaveInterval = 5000, enableBeforeUnload = true } = options;
  const [formState, setFormState] = useState<FormState>({
    data: initialData,
    isDirty: false,
    lastSaved: Date.now(),
    isAutoSaving: false
  });
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        const persistedData = localStorage.getItem(`form_${key}`);
        if (persistedData) {
          const parsed = JSON.parse(persistedData);
          setFormState(prev => ({
            ...prev,
            data: { ...initialData, ...parsed.data },
            lastSaved: parsed.lastSaved || Date.now(),
            isDirty: false
          }));
        }
      } catch (error) {
        console.warn('Failed to load persisted form data:', error);
      }
      isInitializedRef.current = true;
    };

    loadPersistedData();
  }, [key, initialData]);

  // Auto-save functionality
  const saveToStorage = useCallback(async (data: T, isManual = false) => {
    if (!isInitializedRef.current && !isManual) return;
    
    try {
      setFormState(prev => ({ ...prev, isAutoSaving: true }));
      
      const saveData = {
        data,
        lastSaved: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem(`form_${key}`, JSON.stringify(saveData));
      
      setFormState(prev => ({
        ...prev,
        lastSaved: Date.now(),
        isDirty: false,
        isAutoSaving: false
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to save form data:', error);
      setFormState(prev => ({ ...prev, isAutoSaving: false }));
      return false;
    }
  }, [key]);

  // Update form data with auto-save
  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormState(prev => {
      const newData = typeof updates === 'function' 
        ? updates(prev.data)
        : { ...prev.data, ...updates };
      
      const newState = {
        ...prev,
        data: newData,
        isDirty: true
      };

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new auto-save timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveToStorage(newData);
      }, autoSaveInterval);

      return newState;
    });
  }, [autoSaveInterval, saveToStorage]);

  // Manual save
  const saveForm = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    return await saveToStorage(formState.data, true);
  }, [formState.data, saveToStorage]);

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(`form_${key}`);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      setFormState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: Date.now()
      }));
    } catch (error) {
      console.error('Failed to clear persisted data:', error);
    }
  }, [key]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState({
      data: initialData,
      isDirty: false,
      lastSaved: Date.now(),
      isAutoSaving: false
    });
    clearPersistedData();
  }, [initialData, clearPersistedData]);

  // Before unload warning
  useEffect(() => {
    if (!enableBeforeUnload) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formState.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formState.isDirty, enableBeforeUnload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    formData: formState.data,
    isDirty: formState.isDirty,
    isAutoSaving: formState.isAutoSaving,
    lastSaved: formState.lastSaved,
    updateFormData,
    saveForm,
    resetForm,
    clearPersistedData
  };
};