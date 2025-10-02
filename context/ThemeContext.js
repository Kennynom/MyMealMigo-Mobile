import { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

export const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useState(systemColorScheme || 'light');

    const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

    const toggleTheme = () => {
        setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
    };
    
    return (
        <ThemeContext.Provider 
            value={{
                colorScheme, 
                setColorScheme, 
                theme,
                toggleTheme
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};