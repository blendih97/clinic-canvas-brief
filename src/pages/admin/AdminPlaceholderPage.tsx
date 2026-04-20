import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminPlaceholderPage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary">Admin</p>
        <h1 className="mt-2 font-heading text-4xl font-light text-foreground">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-medium">Next milestone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>This section is scaffolded and ready for the next admin milestone.</p>
          <Link to="/admin" className="inline-flex text-primary hover:opacity-80">
            Back to admin dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlaceholderPage;