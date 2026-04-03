import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <Card className="bg-card max-w-md w-full">
        <CardContent className="p-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
          <p className="text-sm text-muted-foreground mb-4">Page not found</p>
          <Button asChild>
            <Link href="/">Back to Structure Search</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
