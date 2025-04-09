
import { useState, useEffect } from "react";
import { useUser } from "../UserContext";
import { useProjects } from "../ProjectContext";
import { ProjectStopwatch } from "./types";
import { formatStopwatchTime } from "./watchUtils";
import { supabase } from "@/integrations/supabase/client";

// Default stopwatch state
const defaultStopwatch: ProjectStopwatch = {
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  lastUpdatedBy: null,
};

export const useWatchProvider = () => {
  const [projectStopwatches, setProjectStopwatches] = useState<Record<string, ProjectStopwatch>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useUser();
  const { currentProject } = useProjects();
  
  const currentUserId = user?.id || "";

  // Load stopwatches from Supabase
  useEffect(() => {
    if (!user?.id) return;
    
    const loadStopwatch = async () => {
      try {
        if (currentProject) {
          // Load stopwatch for current project
          const { data, error } = await supabase
            .from('project_stopwatches')
            .select('*')
            .eq('project_id', currentProject.id)
            .single();
            
          if (!error && data) {
            setProjectStopwatches(prev => ({
              ...prev,
              [currentProject.id]: {
                isRunning: data.is_running || false,
                startTime: data.start_time ? Number(data.start_time) : null,
                elapsedTime: data.elapsed_time ? Number(data.elapsed_time) : 0,
                lastUpdatedBy: data.last_updated_by
              }
            }));
          } else if (error && error.code !== 'PGRST116') { // Not found is ok
            console.error("Error loading stopwatch:", error);
          }
        } else {
          // Load stopwatches for all projects user has access to
          const { data, error } = await supabase
            .from('project_stopwatches')
            .select('*')
            .limit(10);
            
          if (!error && data) {
            const stopwatches: Record<string, ProjectStopwatch> = {};
            data.forEach(sw => {
              stopwatches[sw.project_id] = {
                isRunning: sw.is_running || false,
                startTime: sw.start_time ? Number(sw.start_time) : null,
                elapsedTime: sw.elapsed_time ? Number(sw.elapsed_time) : 0,
                lastUpdatedBy: sw.last_updated_by
              };
            });
            setProjectStopwatches(stopwatches);
          } else if (error) {
            console.error("Error loading stopwatches:", error);
          }
        }
      } catch (error) {
        console.error("Error in loadStopwatch:", error);
      }
    };
    
    loadStopwatch();
    
    // Set up real-time subscription for stopwatches
    const channel = supabase
      .channel('public:project_stopwatches')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'project_stopwatches',
          filter: currentProject ? `project_id=eq.${currentProject.id}` : undefined
        }, 
        (payload) => {
          if (payload.new) {
            const sw = payload.new as any;
            setProjectStopwatches(prev => ({
              ...prev,
              [sw.project_id]: {
                isRunning: sw.is_running || false,
                startTime: sw.start_time ? Number(sw.start_time) : null,
                elapsedTime: sw.elapsed_time ? Number(sw.elapsed_time) : 0,
                lastUpdatedBy: sw.last_updated_by
              }
            }));
          }
        })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, currentProject?.id]);

  // Update current time and running stopwatches every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Update all running stopwatches locally (UI updates)
      setProjectStopwatches(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.entries(updated).forEach(([projectId, stopwatch]) => {
          if (stopwatch.isRunning && stopwatch.startTime) {
            updated[projectId] = {
              ...stopwatch,
              elapsedTime: Date.now() - stopwatch.startTime
            };
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getProjectStopwatch = (projectId: string): ProjectStopwatch => {
    return projectStopwatches[projectId] || defaultStopwatch;
  };

  const startStopwatch = async (projectId: string) => {
    try {
      // Get current stopwatch state
      const current = getProjectStopwatch(projectId);
      
      if (current.isRunning) return;
      
      // Create updated stopwatch
      const updatedStopwatch: ProjectStopwatch = {
        ...current,
        isRunning: true,
        startTime: Date.now() - current.elapsedTime,
        lastUpdatedBy: currentUserId
      };
      
      // Update Supabase
      await supabase
        .from('project_stopwatches')
        .upsert({
          project_id: projectId,
          is_running: true,
          start_time: updatedStopwatch.startTime,
          elapsed_time: updatedStopwatch.elapsedTime,
          last_updated_by: currentUserId
        });
      
      // Update local state immediately for responsive UI
      setProjectStopwatches(prev => ({
        ...prev,
        [projectId]: updatedStopwatch
      }));
    } catch (error) {
      console.error("Error in startStopwatch:", error);
    }
  };

  const stopStopwatch = async (projectId: string) => {
    try {
      // Get current stopwatch state
      const current = getProjectStopwatch(projectId);
      
      if (!current.isRunning) return;
      
      // Calculate current elapsed time
      const elapsedTime = current.startTime 
        ? Date.now() - current.startTime 
        : current.elapsedTime;
      
      // Create updated stopwatch
      const updatedStopwatch: ProjectStopwatch = {
        ...current,
        isRunning: false,
        elapsedTime,
        lastUpdatedBy: currentUserId
      };
      
      // Update Supabase
      await supabase
        .from('project_stopwatches')
        .upsert({
          project_id: projectId,
          is_running: false,
          start_time: null,
          elapsed_time: elapsedTime,
          last_updated_by: currentUserId
        });
      
      // Update local state immediately
      setProjectStopwatches(prev => ({
        ...prev,
        [projectId]: updatedStopwatch
      }));
    } catch (error) {
      console.error("Error in stopStopwatch:", error);
    }
  };

  const resetStopwatch = async (projectId: string) => {
    try {
      // Create reset stopwatch
      const resetStopwatch: ProjectStopwatch = {
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        lastUpdatedBy: currentUserId
      };
      
      // Update Supabase
      await supabase
        .from('project_stopwatches')
        .upsert({
          project_id: projectId,
          is_running: false,
          start_time: null,
          elapsed_time: 0,
          last_updated_by: currentUserId
        });
      
      // Update local state immediately
      setProjectStopwatches(prev => ({
        ...prev,
        [projectId]: resetStopwatch
      }));
    } catch (error) {
      console.error("Error in resetStopwatch:", error);
    }
  };

  return {
    projectStopwatches,
    currentTime,
    startStopwatch,
    stopStopwatch,
    resetStopwatch,
    formatStopwatchTime,
    getProjectStopwatch,
  };
};
