/**
 * @file src/app/admin/admins/page.tsx
 * @fileoverview Admin management page. Corresponds to the "/admin/admins" route.
 * Allows high-level admins to perform CRUD (Create, Read, Update, Delete) operations on other admin accounts.
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Admin } from '@/lib/data';
import { getAdmins, addAdmin, updateAdmin, deleteAdmin } from '@/lib/firebase-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';


export default function AdminsPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
    const [currentAdmin, setCurrentAdmin] = useState<Partial<Admin> | null>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        const adminList = await getAdmins();
        setAdmins(adminList);
    };

    const handleAddClick = () => {
        setCurrentAdmin({ password: '' });
        setIsDialogOpen(true);
    };

    const handleEditClick = (admin: Admin) => {
        setCurrentAdmin({ ...admin, password: '' }); // Clear password field for security
        setIsDialogOpen(true);
    };
    
    const confirmDelete = (admin: Admin) => {
        setAdminToDelete(admin);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteClick = async () => {
        if (!adminToDelete) return;
        
        await deleteAdmin(adminToDelete.id);
        await fetchAdmins();

        setIsDeleteAlertOpen(false);
        setAdminToDelete(null);
        toast({ title: "Admin Deleted", description: `${adminToDelete.name} has been removed.` });
    };


    const handleSaveChanges = async () => {
        if (!currentAdmin || !currentAdmin.name || !currentAdmin.username) {
            toast({ variant: "destructive", title: "Error", description: "Name and Username are required." });
            return;
        }

        try {
            if (currentAdmin.id) {
                // Editing an admin
                const updateData: Partial<Admin> = { name: currentAdmin.name, username: currentAdmin.username };
                if (currentAdmin.password) {
                    updateData.password = currentAdmin.password;
                }
                await updateAdmin(currentAdmin.id, updateData);
                 toast({ title: "Success", description: "Admin data updated." });
            } else {
                // Adding a new admin
                if (!currentAdmin.password) {
                    toast({ variant: "destructive", title: "Error", description: "Password is required for new admins." });
                    return;
                }
                const newAdmin: Omit<Admin, 'id'> = { 
                    name: currentAdmin.name, 
                    username: currentAdmin.username,
                    password: currentAdmin.password,
                };
                await addAdmin(newAdmin);
                toast({ title: "Success", description: "New admin created." });
            }
            await fetchAdmins();
            setIsDialogOpen(false);
            setCurrentAdmin(null);
           
        } catch(error) {
            console.error("Failed to save admin", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save admin data." });
        }
    };
    
    const handleDialogClose = () => {
      setIsDialogOpen(false);
      setCurrentAdmin(null);
    }


    return (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Admin Users</CardTitle>
                    <Button size="sm" onClick={handleAddClick}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Admin
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map(admin => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">{admin.name}</TableCell>
                                    <TableCell>{admin.username}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEditClick(admin)}>
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" onClick={() => confirmDelete(admin)} disabled={admins.length <= 1}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{currentAdmin?.id ? 'Edit Admin' : 'Add New Admin'}</DialogTitle>
                        <DialogDescription>
                            {currentAdmin?.id ? 'Make changes to the admin details here.' : 'Enter the details for the new admin user.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={currentAdmin?.name || ''}
                                onChange={(e) => setCurrentAdmin({ ...currentAdmin, name: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g. Jane Doe"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                Username
                            </Label>
                            <Input
                                id="username"
                                value={currentAdmin?.username || ''}
                                onChange={(e) => setCurrentAdmin({ ...currentAdmin, username: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g. jdoe"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={currentAdmin?.password || ''}
                                placeholder={currentAdmin?.id ? "Leave blank to keep unchanged" : "Required for new admin"}
                                onChange={(e) => setCurrentAdmin({ ...currentAdmin, password: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the admin account for <span className="font-bold">{adminToDelete?.name}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClick}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}