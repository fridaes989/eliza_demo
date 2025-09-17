// tailwind.config.js

tailwind.config = {
    theme: {
        extend: {
            // Add your custom gradient here
            backgroundImage: {
                'primary-gradient': 'linear-gradient(90deg, #28866C 0%, rgba(0, 136, 106, 0) 100%)',
                 'secondary-gradient': 'linear-gradient(270deg, rgba(255, 255, 201, 0.5) 0%, rgba(230, 175, 60, 0.5) 50%)',
            },

            colors: {
                background: '#0D0D0D',
                surface: '#1A1A1A',
                primary: '#28866C',
                'primary-hover': '#1e6450ff',
                secondary: '#806420',
                error: '#CF6679',
                success: '#4CAF50',
                warning: '#ffb846ff',
                tone:'#FFFFC9',
                blue: '#3A86FF',
                
            }
        }
    }
}


 