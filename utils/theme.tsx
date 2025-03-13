// A simple theme module with fixed colors and styling utilities

// Define our app's color palette
export const AppColors = {
  primary: '#0a7ea4',      // Main brand color (teal blue)
  secondary: '#800020',    // Secondary color (burgundy)
  background: '#ffffff',   // Background color
  text: '#11181C',         // Text color
  inputBackground: '#f2efef',
  buttonBackground: '#800020',
  placeholderText: '#666666', // Placeholder text color
  buttonText: '#000',   // Button text color
  border: '#800020',       // Border color
  success: '#800020',      // Success color (green)
  cancel: 'rgba(0, 0, 0, 0.5)',       // Cancel button color (darker green)
};

// Helper functions to apply theme styles
export const useAppTheme = () => {
  const getInputStyle = (baseStyle: any) => [
    baseStyle, 
    { 
      color: AppColors.text, 
      backgroundColor: AppColors.inputBackground
    }
  ];
  
  const getPlaceholderColor = () => AppColors.placeholderText;
  
  const getButtonStyle = (baseStyle: any, isSecondary: boolean = false) => [
    baseStyle, 
    { 
      backgroundColor: isSecondary ? AppColors.cancel : AppColors.success
    }
  ];
  
  const getContainerStyle = (baseStyle: any) => [
    baseStyle,
    { 
      backgroundColor: AppColors.background,
      borderColor: AppColors.border
    }
  ];
  
  const getTextStyle = (baseStyle: any, isTitle: boolean = false) => [
    baseStyle,
    { color: isTitle ? AppColors.secondary : AppColors.text }
  ];
  
  return {
    colors: AppColors,
    getInputStyle,
    getPlaceholderColor,
    getButtonStyle,
    getContainerStyle,
    getTextStyle
  };
};
