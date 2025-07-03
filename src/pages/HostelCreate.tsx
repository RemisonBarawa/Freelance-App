
import { useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";

const HostelCreate = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (id) {
      // If editing an existing entity
      navigate(`/project-create/${id}`, { replace: true });
    } else {
      // If creating a new entity
      navigate('/project-create', { replace: true });
    }
  }, [id, navigate]);
  
  return null; // This component will redirect, so it doesn't need to render anything
};

export default HostelCreate;
