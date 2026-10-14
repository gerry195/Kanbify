<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Board;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
class BoardFileController extends Controller {
 public function index(Request $request, Board $board) { if (!$board->roleOf($request->user())) return response()->json(['error'=>'Forbidden'],403); return response()->json($board->files()->with('uploader:id,username,fullname')->latest()->get()); }
 public function store(Request $request, Board $board) { if (!$board->roleOf($request->user())) return response()->json(['error'=>'Forbidden'],403); $data=$request->validate(['file'=>'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,png,jpg,jpeg,webp,zip|max:20480']); $upload=$data['file']; $path=$upload->store('board-files/'.$board->id,'local'); $file=$board->files()->create(['user_id'=>$request->user()->id,'original_name'=>$upload->getClientOriginalName(),'path'=>$path,'mime_type'=>$upload->getMimeType(),'size'=>$upload->getSize()]); return response()->json($file->load('uploader:id,username,fullname'),201); }
 public function download(Request $request, Board $board, int $fileId) { if (!$board->roleOf($request->user())) return response()->json(['error'=>'Forbidden'],403); $file=$board->files()->findOrFail($fileId); return Storage::disk('local')->download($file->path,$file->original_name); }
 public function destroy(Request $request, Board $board, int $fileId) { if ($board->roleOf($request->user())!=='admin') return response()->json(['error'=>'Hanya admin yang dapat menghapus file board.'],403); $file=$board->files()->findOrFail($fileId); Storage::disk('local')->delete($file->path); $file->delete(); return response()->json(['success'=>true]); }
}
