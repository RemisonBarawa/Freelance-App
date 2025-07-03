
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, User, UserCheck, Users } from "lucide-react";

interface AdminStatsProps {
  totalUsers: number;
  projectsCount: number;
  studentsCount: number;
  contractsCount: number;
}

const AdminStats = ({ totalUsers, projectsCount, studentsCount, contractsCount }: AdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold">{totalUsers}</div>
            <Users className="text-muted-foreground" size={24} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold">{projectsCount}</div>
            <Home className="text-muted-foreground" size={24} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold">{studentsCount}</div>
            <User className="text-primary" size={24} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold">{contractsCount}</div>
            <UserCheck className="text-muted-foreground" size={24} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
