
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "user" | "project" | "proposal" | "contract";
  onConfirm: () => void;
}

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  itemType,
  onConfirm,
}: DeleteConfirmDialogProps) => {
  const getItemTitle = () => {
    switch (itemType) {
      case "user": return "User";
      case "project": return "Project";
      case "proposal": return "Proposal";
      case "contract": return "Contract";
      default: return "Item";
    }
  };

  const getItemDescription = () => {
    let desc = "Are you sure you want to delete this " + itemType + "? This action cannot be undone.";
    
    if (itemType === "project") {
      desc += " All associated proposals will also be deleted.";
    } else if (itemType === "user") {
      desc += " All associated projects and proposals will also be deleted.";
    }
    
    return desc;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {getItemTitle()}</DialogTitle>
          <DialogDescription>
            {getItemDescription()}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
