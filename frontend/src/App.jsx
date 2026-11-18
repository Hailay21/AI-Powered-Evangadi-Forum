/**
 * Route map: public pages live outside `Layout`; forum tools use `Layout` + `ProtectedRoute`.
 * Add new `<Route>` entries here, then wire navigation in `Sidebar.jsx` and
 * `Layout.jsx` (`getTitle` / `getSubtitle`) so the shell stays in sync.
 */
//import React from "react";
//import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//import { AuthProvider } from "./contexts/AuthContext";
// import Layout from './components/Layout/Layout';
// import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
// import Auth from './pages/Auth/Auth';
// import Dashboard from './pages/Dashboard/Dashboard';
// import Landing from './pages/Landing/Landing';

// function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Routes>
//           {/* Public routes */}

//           {/* Protected routes with Layout */}
//           <Route element={<Layout />}></Route>

//           {/* Catch-all redirect */}
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

// export default App;

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ padding: "30px" }}>
              <h1>AI-Powered Evangadi Forum</h1>
              {/* <p>Frontend is running successfully!</p> */}
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
