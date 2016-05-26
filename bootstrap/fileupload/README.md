# FileUpload

Example for the HTML format
```
    <div class="fileupload fileupload-new" data-provides="fileupload">
        <div class="input-append">
            <div class="uneditable-input">
                <i class="fa fa-file fileupload-exists"></i>
                <span class="fileupload-preview"></span>
            </div>
            <span class="btn btn-default btn-file">
                <span class="fileupload-exists"><i class="fa fa-pencil"></i></span>
                <span class="fileupload-new"><i class="fa fa-file"></i></span>
                {!! Form::file('file', ['id' => 'file', 'required' => 'required']) !!}
            </span>
            <a href="javascript:;" class="btn btn-default fileupload-exists" data-dismiss="fileupload"><i class="fa fa-times"></i></a>
        </div>
    </div>
```