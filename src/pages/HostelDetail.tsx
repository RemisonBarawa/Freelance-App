
import { useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";

const HostelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (id) {
      navigate(`/project/${id}`, { replace: true });
    } else {
      navigate('/project-search', { replace: true });
    }
  }, [id, navigate]);
  
  return null; // This component will redirect, so it doesn't need to render anything
};

export default HostelDetail;
