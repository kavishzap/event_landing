"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getProfile, updateProfile } from "@/lib/supabase/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/lib/supabase/types"
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
} from "@/components/ui/alert-dialog"
import { User, LogOut } from "lucide-react"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}

function ProfileContent() {
  const { session, logout, profile: authProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (session?.userId) {
      getProfile(session.userId)
        .then((fetchedProfile) => {
          if (fetchedProfile) {
            setProfile(fetchedProfile)
            setFirstName(fetchedProfile.first_name || "")
            setLastName(fetchedProfile.last_name || "")
            setPhone(fetchedProfile.phone || "")
          }
          setLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching profile:", error)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [session?.userId])

  const handleSave = async () => {
    if (!session?.userId) return

    const updated = await updateProfile(session.userId, {
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
    })

    if (updated) {
      setProfile(updated)
      setEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } else {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    await logout()
    // Navigate to home page and clear everything
    window.location.href = "/"
  }

  if (loading) {
    return (
      <main className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 max-w-2xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </main>
    )
  }

  const displayName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || session?.name || "User"
    : session?.name || "User"

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-8">Profile</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!editing ? (
                <>
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-semibold">{displayName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-semibold">{session?.email}</p>
                  </div>
                  {profile?.phone && (
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-semibold">{profile.phone}</p>
                    </div>
                  )}
                  {profile && (
                    <div>
                      <Label className="text-muted-foreground">Role</Label>
                      <p className="font-semibold capitalize">{profile.role}</p>
                    </div>
                  )}
                  <Button onClick={() => setEditing(true)} variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 7700 900000"
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-semibold text-muted-foreground">{session?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                      Save Changes
                    </Button>
                    <Button onClick={() => setEditing(false)} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Logout Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Session
              </CardTitle>
              <CardDescription>Manage your account session</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be logged out and redirected to the home page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </main>
  )
}
