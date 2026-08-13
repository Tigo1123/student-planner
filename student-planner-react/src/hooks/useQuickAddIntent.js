import { useEffect, useEffectEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function useQuickAddIntent(entityType, onIntent) {
  const location = useLocation();
  const navigate = useNavigate();
  const handleIntent = useEffectEvent(onIntent);

  useEffect(() => {
    if (location.state?.quickAdd !== entityType) return;

    const date = location.state.date || null;
    handleIntent({ date });
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [entityType, location.hash, location.pathname, location.search, location.state, navigate]);
}

export default useQuickAddIntent;
