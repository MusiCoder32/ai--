import { Layout } from 'antd';
import { AuthProvider } from '@/context/AuthContext';
import { PaperProvider } from '@/context/PaperContext';
import { ChatProvider } from '@/context/ChatContext';
import AppHeader from '@/views/header';
import Home from '@/views/home';

const { Content } = Layout;

function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <ChatProvider>
          <div className="v-center-center bg-#f6f8fa w-full h-full">
       <AppHeader />
                <Home />
          </div>
     
        </ChatProvider>
      </PaperProvider>
    </AuthProvider>
  );
}

export default App;
