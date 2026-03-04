/**
 * @file src/app/admin/reports/page.tsx
 * @fileoverview This is a deprecated page. Its content and functionality have been merged into the main
 * admin dashboard at `/admin`. This file is kept for routing purposes but can be removed in a future cleanup.
 */
'use client';

// This page's content has been moved to /admin/page.tsx to create a unified view.
// This file can be removed in the future.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsPage() {

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Reports Page (Deprecated)</CardTitle>
                    <CardDescription>
                        The content of this page has been moved to the new "Statistics & Reports" section.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>Please use the main admin page to view all reports.</p>
                </CardContent>
            </Card>
        </div>
    );
}