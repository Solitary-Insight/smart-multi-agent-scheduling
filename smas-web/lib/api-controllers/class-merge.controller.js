import { HttpStatusCode } from "axios";
import { ClassMergeService } from "../api-services/class-merger.service";

export class ClassMergeController {
    constructor() {
        this.classMergeService = new ClassMergeService();
    }

    // ===============================
    // Get all merged classes
    // ===============================
    async getMergeClasses({ onSuccess, onFailed }) {
        try {
            const result = await this.classMergeService.getMergeClasses();
            
            // Assuming your service returns the array of merges directly
            onSuccess(result);
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.message
                || "Failed to fetch merged classes";

            onFailed(errorMessage);
        }
    }

    // ===============================
    // Merge classes
    // ===============================
    async mergeClasses({ payload, onSuccess, onFailed }) {
        try {
            const result = await this.classMergeService.mergeClasses({ payload });

            onSuccess(result);
        } catch (error) {
            const errorMessage = error.response?.data?.message
                || error.message
                || "An unknown error occurred during merging";

            onFailed(errorMessage);
        }
    }

    async deleteMergeClasses({ id, onSuccess, onFailed }) {
        try {
          const result = await this.classMergeService.deleteMergeClasses(id);
          onSuccess(result);
        } catch (error) {
          console.error("[DELETE-CLASS-MERGE-ERROR]", error);
    
          switch (error.status) {
            case HttpStatusCode.NotFound:
              onFailed("Merge class not found.");
              break;
            default:
              onFailed("Failed to delete merge class. Please try again.");
          }
        }
      }

}