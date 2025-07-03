
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Bell, BellOff, Clock, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const displayedNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_accepted':
        return <Check className="text-green-500" />;
      case 'assignment_rejected':
      case 'assignment_auto_rejected':
        return <BellOff className="text-red-500" />;
      default:
        return <Bell className="text-blue-500" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft />
          </Button>
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
          </div>
          
          {notifications.some(n => !n.read) && (
            <Button 
              variant="outline" 
              onClick={() => {
                notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-secondary h-24 rounded-md"></div>
            ))}
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
              <Bell size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No notifications</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any {filter === 'unread' ? 'unread ' : ''}notifications at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={notification.read ? "opacity-75" : ""}
              >
                <CardHeader className="pb-2 pt-4">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center bg-secondary rounded-full">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <h3 className="font-medium">
                        {notification.notification_type.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{notification.message}</p>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  {notification.project_id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/project/${notification.project_id}`)}
                    >
                      View Project
                    </Button>
                  )}
                  
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
